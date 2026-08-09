using EsnApp.Application.Common;

namespace EsnApp.Application.Identity;

public interface IIdentityService
{
    Task<Result<AuthResponse>> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default);

    Task<Result<AuthResponse>> LoginAsync(LoginRequest request, CancellationToken cancellationToken = default);

    Task<Result<IReadOnlyList<AdminUserDto>>> GetAdminsAsync(
        CancellationToken cancellationToken = default);
}
