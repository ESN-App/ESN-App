using EsnApp.Domain.Events;

namespace EsnApp.Application.Events.Abstractions;

public record EventPage(IReadOnlyList<Event> Items, int TotalCount);
