using EsnApp.Application.Common;
using EsnApp.Application.Events.Abstractions;
using EsnApp.Application.Events.Common;
using MediatR;

namespace EsnApp.Application.Events.GetAdminEvents;

public class GetAdminEventsQueryHandler(IEventRepository repository)
    : IRequestHandler<GetAdminEventsQuery, Result<PagedResult<AdminEventDetailsDto>>>
{
    public async Task<Result<PagedResult<AdminEventDetailsDto>>> Handle(
        GetAdminEventsQuery request,
        CancellationToken cancellationToken)
    {
        var events = await repository.GetAdminPageAsync(
            request.From,
            request.To,
            request.Page,
            request.PageSize,
            cancellationToken);

        return Result.Success(new PagedResult<AdminEventDetailsDto>(
            events.Items.Select(entity => entity.ToAdminDto()).ToList(),
            request.Page,
            request.PageSize,
            events.TotalCount));
    }
}
