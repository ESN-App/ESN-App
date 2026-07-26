using EsnApp.Application.Common;
using EsnApp.Application.Events.Common;
using MediatR;

namespace EsnApp.Application.Events.GetEventsList;

public record GetEventsListQuery(
    DateTimeOffset From,
    DateTimeOffset To,
    int Page,
    int PageSize) : IRequest<Result<PagedResult<EventListItemDto>>>;
