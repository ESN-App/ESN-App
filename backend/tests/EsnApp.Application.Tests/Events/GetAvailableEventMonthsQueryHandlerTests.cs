using EsnApp.Application.Events.Abstractions;
using EsnApp.Application.Events.GetAvailableEventMonths;
using EsnApp.Domain.Events;

namespace EsnApp.Application.Tests.Events;

public class GetAvailableEventMonthsQueryHandlerTests
{
    [Fact]
    public async Task Handle_ReturnsDistinctSortedMonthsForPublishedEvents()
    {
        var events = new List<Event>
        {
            CreateEvent(new DateTimeOffset(2026, 9, 10, 12, 0, 0, TimeSpan.Zero)),
            CreateEvent(new DateTimeOffset(2026, 7, 2, 12, 0, 0, TimeSpan.Zero)),
            CreateEvent(new DateTimeOffset(2026, 7, 20, 12, 0, 0, TimeSpan.Zero)),
            CreateEvent(
                new DateTimeOffset(2026, 8, 5, 12, 0, 0, TimeSpan.Zero),
                EventStatus.Draft),
        };
        var handler = new GetAvailableEventMonthsQueryHandler(new FakeEventRepository(events));

        var result = await handler.Handle(
            new GetAvailableEventMonthsQuery(),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(["2026-07", "2026-09"], result.Value);
    }

    private static Event CreateEvent(
        DateTimeOffset startsAt,
        EventStatus status = EventStatus.Published) =>
        new()
        {
            Title = "Event",
            ShortDescription = "Summary",
            Description = "Description",
            Location = "Gdańsk",
            StartsAt = startsAt,
            Status = status,
        };

    private sealed class FakeEventRepository(IReadOnlyList<Event> events) : IEventRepository
    {
        public Task<IReadOnlyList<Event>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(events);

        public Task<EventPage> GetPublicPageAsync(
            DateTimeOffset from,
            DateTimeOffset to,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<EventPage> GetAdminPageAsync(
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<EventPage> GetAdminPageAsync(
            DateTimeOffset? from,
            DateTimeOffset? to,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<Event?> GetByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<Event?> GetPublicByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<Event> AddAsync(
            Event entity,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<Event> UpdateAsync(
            Event entity,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();

        public Task<bool> DeleteAsync(
            Guid id,
            CancellationToken cancellationToken = default) =>
            throw new NotSupportedException();
    }
}
