using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Api.Contracts.Auth;

namespace TaskFlow.Api.Tests;

public class AuthEndpointsTests(TaskFlowApiFactory factory) : IClassFixture<TaskFlowApiFactory>
{
    private const string SessionCookieName = "taskflow.session";

    private static string? SetCookieHeader(HttpResponseMessage response)
    {
        return response.Headers.TryGetValues("Set-Cookie", out var values)
            ? values.FirstOrDefault(v => v.StartsWith(SessionCookieName))
            : null;
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsUserAndSetsSessionCookie()
    {
        factory.SeedUser("Ada Lovelace", "ada.login@example.com", "correct-horse-battery");
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "ada.login@example.com",
            password = "correct-horse-battery"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<LoginResponse>();
        Assert.NotNull(body);
        Assert.Equal("Ada Lovelace", body.Name);
        Assert.Equal("ada.login@example.com", body.Email);
        Assert.NotNull(SetCookieHeader(response));
    }

    [Fact]
    public async Task Login_NormalizesEmailCasingAndWhitespace()
    {
        factory.SeedUser("Grace Hopper", "grace@example.com", "a-strong-password");
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "  GRACE@Example.COM  ",
            password = "a-strong-password"
        });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithWrongPassword_Returns401()
    {
        factory.SeedUser("Alan Turing", "alan@example.com", "the-real-password");
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "alan@example.com",
            password = "not-the-password"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
        Assert.Null(SetCookieHeader(response));
    }

    [Fact]
    public async Task Login_FailureResponse_DoesNotRevealWhetherEmailExists()
    {
        factory.SeedUser("Known User", "known@example.com", "the-real-password");
        using var client = factory.CreateClient();

        var wrongPassword = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "known@example.com",
            password = "not-the-password"
        });
        var unknownEmail = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "nobody@example.com",
            password = "whatever-password"
        });

        Assert.Equal(HttpStatusCode.Unauthorized, wrongPassword.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknownEmail.StatusCode);

        // Both failures must be indistinguishable to the caller.
        var wrongPasswordProblem = await wrongPassword.Content.ReadFromJsonAsync<ProblemDetails>();
        var unknownEmailProblem = await unknownEmail.Content.ReadFromJsonAsync<ProblemDetails>();
        Assert.Equal("Invalid email or password.", wrongPasswordProblem!.Title);
        Assert.Equal(wrongPasswordProblem.Title, unknownEmailProblem!.Title);
        Assert.Equal(wrongPasswordProblem.Detail, unknownEmailProblem.Detail);
    }

    [Theory]
    [InlineData("", "some-password")]
    [InlineData("not-an-email", "some-password")]
    [InlineData("valid@example.com", "")]
    public async Task Login_WithInvalidInput_Returns400(string email, string password)
    {
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithoutSession_Returns401()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Me_WithSession_ReturnsCurrentUser()
    {
        var seeded = factory.SeedUser("Margaret Hamilton", "margaret@example.com", "apollo-guidance");
        using var client = factory.CreateClient();

        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "margaret@example.com",
            password = "apollo-guidance"
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);

        var response = await client.GetAsync("/api/auth/me");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<CurrentUserResponse>();
        Assert.NotNull(body);
        Assert.Equal(seeded.Id, body.Id);
        Assert.Equal("Margaret Hamilton", body.Name);
        Assert.Equal("margaret@example.com", body.Email);
    }

    [Fact]
    public async Task Logout_EndsSession_SoProtectedEndpointsReturn401()
    {
        factory.SeedUser("Katherine Johnson", "katherine@example.com", "orbital-mechanics");
        using var client = factory.CreateClient();

        var login = await client.PostAsJsonAsync("/api/auth/login", new
        {
            email = "katherine@example.com",
            password = "orbital-mechanics"
        });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);

        var logout = await client.PostAsync("/api/auth/logout", content: null);
        Assert.Equal(HttpStatusCode.NoContent, logout.StatusCode);

        var me = await client.GetAsync("/api/auth/me");
        Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);
    }

    [Fact]
    public async Task Register_RemainsAccessibleWithoutSession()
    {
        using var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/register", new
        {
            name = "New User",
            email = "new.user@example.com",
            password = "a-valid-password"
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }
}
