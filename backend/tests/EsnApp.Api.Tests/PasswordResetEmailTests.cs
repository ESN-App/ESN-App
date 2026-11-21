using EsnApp.Api.Controllers;
using EsnApp.Application.Common;
using EsnApp.Application.Identity;
using Microsoft.AspNetCore.Mvc;

namespace EsnApp.Api.Tests;

public class PasswordResetEmailTests
{
    private sealed class FakeIdentity(Result result) : IIdentityService
    {
        public Task<Result> RequestPasswordResetAsync(string userId, CancellationToken cancellationToken = default) => Task.FromResult(result);
        public Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Result<IReadOnlyList<AdminUserDto>>> GetAdminsAsync(CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Result<AdminUserDto>> CreateAdminAsync(CreateAdminRequest request, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Result> DeleteAdminAsync(string id, string currentUserId, CancellationToken cancellationToken = default) => throw new NotSupportedException();
        public Task<Result> ResetPasswordAsync(string email, string token, string newPassword, CancellationToken cancellationToken = default) => throw new NotSupportedException();
    }

    [Fact]
    public async Task Email_failure_maps_to_503_problem_details()
    {
        var controller = new AdminUsersController(new FakeIdentity(Result.Failure(IIdentityService.EmailNotSentError)), null!);

        var response = await controller.RequestPasswordReset("1", CancellationToken.None);

        var problem = Assert.IsType<ObjectResult>(response);
        Assert.Equal(503, problem.StatusCode);
    }

    [Fact]
    public async Task Unknown_admin_stays_400()
    {
        var controller = new AdminUsersController(new FakeIdentity(Result.Failure("Administrator not found.")), null!);

        Assert.IsType<BadRequestObjectResult>(await controller.RequestPasswordReset("1", CancellationToken.None));
    }
}
