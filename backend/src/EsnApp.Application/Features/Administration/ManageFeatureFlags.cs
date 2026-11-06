using EsnApp.Application.Common;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Features;

public record GetAdminFeatureFlagsQuery : IRequest<Result<IReadOnlyList<FeatureFlagDto>>>;

public class GetAdminFeatureFlagsQueryHandler(IFeatureFlagRepository repository)
    : IRequestHandler<GetAdminFeatureFlagsQuery, Result<IReadOnlyList<FeatureFlagDto>>>
{
    public async Task<Result<IReadOnlyList<FeatureFlagDto>>> Handle(
        GetAdminFeatureFlagsQuery request,
        CancellationToken cancellationToken)
    {
        var flags = await repository.GetAllAsync(cancellationToken);
        IReadOnlyList<FeatureFlagDto> items = flags
            .Where(flag => FeatureFlagKeys.All.Contains(flag.Key))
            .Select(flag => new FeatureFlagDto(flag.Key, flag.Enabled, flag.UpdatedAt))
            .ToList();
        return Result.Success(items);
    }
}

public record UpdateFeatureFlagCommand(string Key, bool Enabled) : IRequest<Result<FeatureFlagDto>>;

public class UpdateFeatureFlagCommandValidator : AbstractValidator<UpdateFeatureFlagCommand>
{
    public UpdateFeatureFlagCommandValidator()
    {
        RuleFor(command => command.Key).NotEmpty().MaximumLength(100);
    }
}

public class UpdateFeatureFlagCommandHandler(IFeatureFlagRepository repository)
    : IRequestHandler<UpdateFeatureFlagCommand, Result<FeatureFlagDto>>
{
    public async Task<Result<FeatureFlagDto>> Handle(
        UpdateFeatureFlagCommand request,
        CancellationToken cancellationToken)
    {
        // Only known keys can be toggled; admins cannot create arbitrary flags.
        var flag = FeatureFlagKeys.All.Contains(request.Key)
            ? await repository.GetByKeyAsync(request.Key, cancellationToken)
            : null;
        if (flag is null)
            return Result.Failure<FeatureFlagDto>($"Feature flag '{request.Key}' was not found.");

        flag.Enabled = request.Enabled;
        flag.UpdatedAt = DateTimeOffset.UtcNow;
        flag = await repository.UpdateAsync(flag, cancellationToken);
        return Result.Success(new FeatureFlagDto(flag.Key, flag.Enabled, flag.UpdatedAt));
    }
}
