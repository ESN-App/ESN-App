using EsnApp.Application.Common;
using EsnApp.Application.Events.Abstractions;
using EsnApp.Application.Events.Common;
using MediatR;

namespace EsnApp.Application.Events.GetAdminEvents;

public class GetAdminEventsQueryHandler(IEventRepository repository)
    : IRequestHandler<GetAdminEventsQuery, Result<PagedResult<EventDetailsDto>>>
{
    public async Task<Result<PagedResult<EventDetailsDto>>> Handle(
        GetAdminEventsQuery request,
        CancellationToken cancellationToken)
    {
        var events = await repository.GetAdminPageAsync(
            request.Status,
            request.From,
            request.To,
            request.Page,
            request.PageSize,
            cancellationToken);

        return Result.Success(new PagedResult<EventDetailsDto>(
            events.Items.Select(entity => entity.ToDetailsDto()).ToList(),
            request.Page,
            request.PageSize,
            events.TotalCount));
    }
}
