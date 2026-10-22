using TaskFlow.Api.Models;
using TaskFlow.Api.Repositories;

namespace TaskFlow.Api.Tests;

/// <summary>
/// In-memory stand-in for the PostgreSQL repository so integration tests
/// can run without a database.
/// </summary>
public class InMemoryUserRepository : IUserRepository
{
    private readonly List<User> users = [];
    private readonly object gate = new();

    public void Add(User user)
    {
        lock (gate)
        {
            users.Add(user);
        }
    }

    public Task<bool> TryAddAsync(User user, CancellationToken cancellationToken = default)
    {
        lock (gate)
        {
            if (users.Any(u => string.Equals(u.Email, user.Email, StringComparison.OrdinalIgnoreCase)))
            {
                return Task.FromResult(false);
            }
            users.Add(user);
            return Task.FromResult(true);
        }
    }

    public Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        lock (gate)
        {
            return Task.FromResult(users.FirstOrDefault(u => u.Email == email));
        }
    }
}
