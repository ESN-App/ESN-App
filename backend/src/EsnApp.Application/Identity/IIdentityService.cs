using EsnApp.Application.Common;

namespace EsnApp.Application.Identity;

public interface IIdentityService
{
    Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);

    Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

    Task<Result<IReadOnlyList<AdminUserDto>>> GetAdminsAsync(
        CancellationToken cancellationToken = default);

    Task<Result<AdminUserDto>> CreateAdminAsync(
        CreateAdminRequest request,
        CancellationToken cancellationToken = default);

    Task<Result> DeleteAdminAsync(
        string id,
        string currentUserId,
        CancellationToken cancellationToken = default);

    Task<Result> RequestPasswordResetAsync(
        string userId,
        CancellationToken cancellationToken = default);

    Task<Result> ResetPasswordAsync(
        string email,
        string token,
        string newPassword,
        CancellationToken cancellationToken = default);
}
