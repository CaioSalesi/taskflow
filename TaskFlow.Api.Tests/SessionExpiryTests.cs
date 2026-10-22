using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Time.Testing;

namespace TaskFlow.Api.Tests;

/// <summary>
/// Verifies the fixed one-week session: still valid just before the cutoff,
/// automatically invalid after it. Uses a fake clock injected into the cookie
/// handler so no real waiting is involved.
/// </summary>
public class SessionExpiryTests
{
    private static (TaskFlowApiFactory Factory, HttpClient Client, FakeTimeProvider Clock) CreateLoggedInClient()
    {
        var clock = new FakeTimeProvider(DateTimeOffset.UtcNow);
        var factory = new TaskFlowApiFactory();
        var client = factory
            .WithWebHostBuilder(builder => builder.ConfigureServices(services =>
                services.PostConfigure<CookieAuthenticationOptions>(
                    CookieAuthenticationDefaults.AuthenticationScheme,
                    options => options.TimeProvider = clock)))
            .CreateClient();
        return (factory, client, clock);
    }

    [Fact]
    public async Task Session_IsStillValidJustBeforeOneWeek()
    {
        var (factory, client, clock) = CreateLoggedInClient();
        using (factory)
        using (client)
        {
            factory.SeedUser("Ada Lovelace", "ada.expiry@example.com", "a-strong-password");
            var login = await client.PostAsJsonAsync("/api/auth/login", new
            {
                email = "ada.expiry@example.com",
                password = "a-strong-password"
            });
            Assert.Equal(HttpStatusCode.OK, login.StatusCode);

            clock.Advance(TimeSpan.FromDays(7) - TimeSpan.FromMinutes(5));

            var me = await client.GetAsync("/api/auth/me");
            Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        }
    }

    [Fact]
    public async Task Session_ExpiresAfterOneWeek_SoTheUserIsLoggedOut()
    {
        var (factory, client, clock) = CreateLoggedInClient();
        using (factory)
        using (client)
        {
            factory.SeedUser("Ada Lovelace", "ada.expired@example.com", "a-strong-password");
            var login = await client.PostAsJsonAsync("/api/auth/login", new
            {
                email = "ada.expired@example.com",
                password = "a-strong-password"
            });
            Assert.Equal(HttpStatusCode.OK, login.StatusCode);

            clock.Advance(TimeSpan.FromDays(7) + TimeSpan.FromMinutes(5));

            var me = await client.GetAsync("/api/auth/me");
            Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);
        }
    }

    [Fact]
    public async Task Session_IsNotExtendedByActivity()
    {
        var (factory, client, clock) = CreateLoggedInClient();
        using (factory)
        using (client)
        {
            factory.SeedUser("Ada Lovelace", "ada.sliding@example.com", "a-strong-password");
            var login = await client.PostAsJsonAsync("/api/auth/login", new
            {
                email = "ada.sliding@example.com",
                password = "a-strong-password"
            });
            Assert.Equal(HttpStatusCode.OK, login.StatusCode);

            // Use the session every day; the one-week limit must still apply
            // from the original login, not from the last request.
            for (var day = 1; day <= 6; day++)
            {
                clock.Advance(TimeSpan.FromDays(1));
                var check = await client.GetAsync("/api/auth/me");
                Assert.Equal(HttpStatusCode.OK, check.StatusCode);
            }

            clock.Advance(TimeSpan.FromDays(1) + TimeSpan.FromMinutes(5));
            var me = await client.GetAsync("/api/auth/me");
            Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);
        }
    }
}
