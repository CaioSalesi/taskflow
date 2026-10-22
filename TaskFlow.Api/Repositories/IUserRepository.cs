using TaskFlow.Api.Models;

namespace TaskFlow.Api.Repositories;

public interface IUserRepository
{
    /// <summary>
    /// Adds the user if the email is not taken (case-insensitive).
    /// Returns false when the email is already registered.
    /// </summary>
    Task<bool> TryAddAsync(User user, CancellationToken cancellationToken = default);

    /// <summary>
    /// Finds a user by email (expects the normalized, lowercase form).
    /// Returns null when no user has that email.
    /// </summary>
    Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default);
}
