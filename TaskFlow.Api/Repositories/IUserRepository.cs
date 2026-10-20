using TaskFlow.Api.Models;

namespace TaskFlow.Api.Repositories;

public interface IUserRepository
{
    /// <summary>
    /// Adds the user if the email is not taken (case-insensitive).
    /// Returns false when the email is already registered.
    /// </summary>
    Task<bool> TryAddAsync(User user, CancellationToken cancellationToken = default);
}
