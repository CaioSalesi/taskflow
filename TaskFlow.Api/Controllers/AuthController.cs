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
}
