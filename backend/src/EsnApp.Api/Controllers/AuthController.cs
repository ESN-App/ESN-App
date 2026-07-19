using EsnApp.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(IIdentityService identityService) : ControllerBase
{
    /// <summary>Registers a new account and returns a JWT.</summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var result = await identityService.RegisterAsync(request, cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { error = result.Error });
    }

    /// <summary>Logs in with email and password and returns a JWT.</summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(AuthResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var result = await identityService.LoginAsync(request, cancellationToken);

        return result.IsSuccess ? Ok(result.Value) : Unauthorized(new { error = result.Error });
    }
}
