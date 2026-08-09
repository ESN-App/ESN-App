using EsnApp.Application.Common;
using EsnApp.Application.Events.Abstractions;
using EsnApp.Application.Events.Common;
using MediatR;

namespace EsnApp.Application.Events.GetEventsList;

public class GetEventsListQueryHandler(IEventRepository repository)
    : IRequestHandler<GetEventsListQuery, Result<PagedResult<EventListItemDto>>>
{
    public async Task<Result<PagedResult<EventListItemDto>>> Handle(
        GetEventsListQuery request,
        CancellationToken cancellationToken)
    {
        var events = await repository.GetPublicPageAsync(
            request.From,
            request.To,
            request.Page,
            request.PageSize,
            cancellationToken);

        return Result.Success(new PagedResult<EventListItemDto>(
            events.Items.Select(entity => entity.ToListItemDto()).ToList(),
            request.Page,
            request.PageSize,
            events.TotalCount));
    }
}
