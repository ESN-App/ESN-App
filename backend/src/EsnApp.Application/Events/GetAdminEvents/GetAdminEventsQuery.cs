using EsnApp.Application.Common;
using EsnApp.Application.Events.Common;
using EsnApp.Domain.Events;
using MediatR;

namespace EsnApp.Application.Events.GetAdminEvents;

public record GetAdminEventsQuery(
    EventStatus? Status,
    DateTimeOffset? From,
    DateTimeOffset? To,
    int Page,
    int PageSize) : IRequest<Result<PagedResult<EventDetailsDto>>>;
