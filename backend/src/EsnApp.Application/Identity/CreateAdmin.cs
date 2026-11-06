using EsnApp.Application.Common;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Identity;

public class CreateAdminRequestValidator : AbstractValidator<CreateAdminRequest>
{
    public const int MaxNameLength = 50;

    public CreateAdminRequestValidator()
    {
        RuleFor(request => request.Email).NotEmpty().EmailAddress();
        RuleFor(request => request.Password).NotEmpty();
        RuleFor(request => request.FirstName).NotEmpty().Must(BeShortEnough)
            .WithMessage($"First name must be at most {MaxNameLength} characters.");
        RuleFor(request => request.LastName).NotEmpty().Must(BeShortEnough)
            .WithMessage($"Last name must be at most {MaxNameLength} characters.");
    }

    // Names are stored trimmed, so surrounding whitespace doesn't count against the limit.
    private static bool BeShortEnough(string? name) => (name?.Trim().Length ?? 0) <= MaxNameLength;
}

public class CreateAdminRequestHandler(IIdentityService identityService)
    : IRequestHandler<CreateAdminRequest, Result<AdminUserDto>>
{
    public Task<Result<AdminUserDto>> Handle(
        CreateAdminRequest request,
        CancellationToken cancellationToken) =>
        identityService.CreateAdminAsync(request, cancellationToken);
}
