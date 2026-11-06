using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Features;

public record FeatureFlagDto(string Key, bool Enabled, DateTimeOffset UpdatedAt);

/// <summary>Public map of known flag key to enabled state.</summary>
public record GetFeatureFlagsQuery : IRequest<Result<IReadOnlyDictionary<string, bool>>>;

public class GetFeatureFlagsQueryHandler(IFeatureFlagRepository repository)
    : IRequestHandler<GetFeatureFlagsQuery, Result<IReadOnlyDictionary<string, bool>>>
{
    public async Task<Result<IReadOnlyDictionary<string, bool>>> Handle(
        GetFeatureFlagsQuery request,
        CancellationToken cancellationToken)
    {
        var flags = await repository.GetAllAsync(cancellationToken);
        IReadOnlyDictionary<string, bool> map = flags
            .Where(flag => FeatureFlagKeys.All.Contains(flag.Key))
            .ToDictionary(flag => flag.Key, flag => flag.Enabled);
        return Result.Success(map);
    }
}
