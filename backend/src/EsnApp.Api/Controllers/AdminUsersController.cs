using EsnApp.Application.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Controllers;

[ApiController]
[Route("api/admin/admins")]
[Authorize(Roles = "Admin")]
public class AdminUsersController(IIdentityService identityService) : ControllerBase
{
    /// <summary>Lists users with the administrator role.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<AdminUserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetList(CancellationToken cancellationToken)
    {
        var result = await identityService.GetAdminsAsync(cancellationToken);
        return Ok(result.Value);
    }
}
