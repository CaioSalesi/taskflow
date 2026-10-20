using System.Text.Json;
using TaskFlow.Api.Models;

namespace TaskFlow.Api.Repositories;

/// <summary>
/// Stores users in a JSON file. A semaphore serializes read-modify-write cycles
/// so concurrent registrations cannot corrupt the file or duplicate an email.
/// </summary>
public class JsonUserRepository : IUserRepository
{
    private static readonly JsonSerializerOptions SerializerOptions = new() { WriteIndented = true };
    private readonly SemaphoreSlim _lock = new(1, 1);
    private readonly string _filePath;

    public JsonUserRepository(IConfiguration configuration, IWebHostEnvironment environment)
    {
        var configuredPath = configuration["Database:UsersFilePath"] ?? "Data/users.json";
        _filePath = Path.IsPathRooted(configuredPath)
            ? configuredPath
            : Path.Combine(environment.ContentRootPath, configuredPath);
    }

    public async Task<bool> TryAddAsync(User user, CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken);
        try
        {
            var users = await LoadAsync(cancellationToken);

            if (users.Any(u => string.Equals(u.Email, user.Email, StringComparison.OrdinalIgnoreCase)))
                return false;

            users.Add(user);
            await SaveAsync(users, cancellationToken);
            return true;
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task<List<User>> LoadAsync(CancellationToken cancellationToken)
    {
        if (!File.Exists(_filePath))
            return [];

        await using var stream = File.OpenRead(_filePath);
        if (stream.Length == 0)
            return [];

        return await JsonSerializer.DeserializeAsync<List<User>>(stream, cancellationToken: cancellationToken) ?? [];
    }

    private async Task SaveAsync(List<User> users, CancellationToken cancellationToken)
    {
        var directory = Path.GetDirectoryName(_filePath);
        if (!string.IsNullOrEmpty(directory))
            Directory.CreateDirectory(directory);

        // Write to a temp file and swap so a crash mid-write never leaves a truncated database.
        var tempPath = _filePath + ".tmp";
        await using (var stream = File.Create(tempPath))
        {
            await JsonSerializer.SerializeAsync(stream, users, SerializerOptions, cancellationToken);
        }

        File.Move(tempPath, _filePath, overwrite: true);
    }
}
