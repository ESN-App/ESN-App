using EsnApp.Application.Common;
using EsnApp.Application.Events.Common;
using MediatR;

namespace EsnApp.Application.Events.GetAdminEvents;

public record GetAdminEventsQuery(
    DateTimeOffset? From,
    DateTimeOffset? To,
    int Page,
    int PageSize) : IRequest<Result<PagedResult<EventDetailsDto>>>;
