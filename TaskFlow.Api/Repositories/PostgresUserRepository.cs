using Microsoft.EntityFrameworkCore;
using Npgsql;
using TaskFlow.Api.Data;
using TaskFlow.Api.Models;

namespace TaskFlow.Api.Repositories;

/// <summary>
/// Stores users in PostgreSQL. Email uniqueness is enforced by the database's
/// unique index, so concurrent registrations with the same email cannot race.
/// </summary>
public class PostgresUserRepository(AppDbContext dbContext) : IUserRepository
{
    public async Task<bool> TryAddAsync(User user, CancellationToken cancellationToken = default)
    {
        dbContext.Users.Add(user);
        try
        {
            await dbContext.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (DbUpdateException ex)
            when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return false;
        }
    }

    public Task<User?> FindByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        return dbContext.Users.FirstOrDefaultAsync(user => user.Email == email, cancellationToken);
    }
}
