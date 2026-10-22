using System.ComponentModel.DataAnnotations;

namespace TaskFlow.Api.Contracts.Auth;

public class LoginRequest
{
    [Required]
    [EmailAddress]
    [StringLength(254)]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}
