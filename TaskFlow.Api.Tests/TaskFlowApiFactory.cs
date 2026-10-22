using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using TaskFlow.Api.Models;
using TaskFlow.Api.Repositories;
using TaskFlow.Api.Services;

namespace TaskFlow.Api.Tests;

public class TaskFlowApiFactory : WebApplicationFactory<Program>
{
    private readonly Pbkdf2PasswordHasher passwordHasher = new();

    public InMemoryUserRepository Users { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        // "Testing" skips the development-only startup migration, and the
        // in-memory repository removes the PostgreSQL dependency.
        builder.UseEnvironment("Testing");
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IUserRepository>();
            services.AddSingleton<IUserRepository>(Users);
        });
    }

    /// <summary>
    /// Creates a user directly in the repository with a genuinely hashed
    /// password, the same way registration stores it.
    /// </summary>
    public User SeedUser(string name, string email, string password)
    {
        var user = new User
        {
            Name = name,
            Email = email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHasher.Hash(password)
        };
        Users.Add(user);
        return user;
    }
}
