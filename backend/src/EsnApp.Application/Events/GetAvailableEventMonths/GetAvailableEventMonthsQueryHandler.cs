using EsnApp.Application.Common;
using EsnApp.Application.Events.Abstractions;
using EsnApp.Domain.Events;
using MediatR;

namespace EsnApp.Application.Events.GetAvailableEventMonths;

public class GetAvailableEventMonthsQueryHandler(IEventRepository repository)
    : IRequestHandler<GetAvailableEventMonthsQuery, Result<IReadOnlyList<string>>>
{
    public async Task<Result<IReadOnlyList<string>>> Handle(
        GetAvailableEventMonthsQuery request,
        CancellationToken cancellationToken)
    {
        var events = await repository.GetAllAsync(cancellationToken);
        var months = events
            .Where(entity => entity.Status is EventStatus.Published or EventStatus.Cancelled)
            .Select(entity => $"{entity.StartsAt.Year:D4}-{entity.StartsAt.Month:D2}")
            .Distinct()
            .Order()
            .ToList();

        return Result.Success<IReadOnlyList<string>>(months);
    }
}
