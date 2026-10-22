using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Api.Contracts.Auth;
using TaskFlow.Api.Models;
using TaskFlow.Api.Repositories;
using TaskFlow.Api.Services;

namespace TaskFlow.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IUserRepository userRepository, IPasswordHasher passwordHasher) : ControllerBase
{
    /// <summary>
    /// A syntactically valid hash that matches no password. Verified against
    /// when the email is unknown so the response takes roughly the same time
    /// as a real verification, preventing account enumeration via timing.
    /// </summary>
    private const string UnknownUserPasswordHash =
        "100000.AAAAAAAAAAAAAAAAAAAAAA==.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";

    [HttpPost("register")]
    [ProducesResponseType<RegisterResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var user = new User
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = passwordHasher.Hash(request.Password)
        };

        var created = await userRepository.TryAddAsync(user, cancellationToken);
        if (!created)
        {
            return Problem(
                title: "Email already registered.",
                statusCode: StatusCodes.Status409Conflict);
        }

        var response = new RegisterResponse(user.Id, user.Name, user.Email);
        return Created($"/api/users/{user.Id}", response);
    }

    [HttpPost("login")]
    [ProducesResponseType<LoginResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await userRepository.FindByEmailAsync(email, cancellationToken);

        var passwordValid = passwordHasher.Verify(
            request.Password,
            user?.PasswordHash ?? UnknownUserPasswordHash);

        if (user is null || !passwordValid)
        {
            // One generic message for both unknown email and wrong password,
            // so the response does not reveal which accounts exist.
            return Problem(
                title: "Invalid email or password.",
                statusCode: StatusCodes.Status401Unauthorized);
        }

        var identity = new ClaimsIdentity(
            [
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email)
            ],
            CookieAuthenticationDefaults.AuthenticationScheme);

        await HttpContext.SignInAsync(
            CookieAuthenticationDefaults.AuthenticationScheme,
            new ClaimsPrincipal(identity));

        return Ok(new LoginResponse(user.Id, user.Name, user.Email));
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout()
    {
        await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType<CurrentUserResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public IActionResult Me()
    {
        var response = new CurrentUserResponse(
            User.FindFirstValue(ClaimTypes.NameIdentifier)!,
            User.FindFirstValue(ClaimTypes.Name)!,
            User.FindFirstValue(ClaimTypes.Email)!);
        return Ok(response);
    }
}
