using EsnApp.Application.Common;
using EsnApp.Application.Events.Common;
using MediatR;

namespace EsnApp.Application.Events.GetAdminEvents;

public record GetAdminEventsQuery(
    int Page,
    int PageSize) : IRequest<Result<PagedResult<EventDetailsDto>>>;
