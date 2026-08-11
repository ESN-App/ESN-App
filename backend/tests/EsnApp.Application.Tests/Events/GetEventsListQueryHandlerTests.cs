using EsnApp.Application.Events.Abstractions;
using EsnApp.Application.Events.GetEventsList;
using EsnApp.Domain.Events;

namespace EsnApp.Application.Tests.Events;

public class GetEventsListQueryHandlerTests
{
    [Fact]
    public async Task Handle_ReturnsPublishedEventsWithinRange()
    {
        var now = DateTimeOffset.UtcNow;
        var events = new List<Event>
        {
            CreateEvent("Welcome Week", now.AddDays(1), EventStatus.Published),
            CreateEvent("City Game", now.AddDays(2), EventStatus.Published),
            CreateEvent("Draft Event", now.AddDays(3), EventStatus.Draft),
            CreateEvent("Later Event", now.AddMonths(2), EventStatus.Published),
        };
        var handler = new GetEventsListQueryHandler(new FakeEventRepository(events));

        var result = await handler.Handle(
            new GetEventsListQuery(now, now.AddMonths(1), 1, 20),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal(2, result.Value.Items.Count);
        Assert.Equal(2, result.Value.TotalCount);
        Assert.Equal("Welcome Week", result.Value.Items[0].Title);
    }

    [Fact]
    public async Task Handle_WithNoMatchingEvents_ReturnsEmptyPage()
    {
        var now = DateTimeOffset.UtcNow;
        var handler = new GetEventsListQueryHandler(new FakeEventRepository([]));

        var result = await handler.Handle(
            new GetEventsListQuery(now, now.AddMonths(1), 1, 20),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Empty(result.Value.Items);
        Assert.Equal(0, result.Value.TotalCount);
    }

    private static Event CreateEvent(string title, DateTimeOffset startsAt, EventStatus status) => new()
    {
        Id = Guid.NewGuid(),
        Title = title,
        ShortDescription = "Summary",
        Description = "Full description",
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
            CancellationToken cancellationToken = default)
        {
            var filtered = events
                .Where(entity =>
                    entity.Status == EventStatus.Published
                    && entity.StartsAt >= from
                    && entity.StartsAt < to)
                .OrderBy(entity => entity.StartsAt)
                .ToList();

            return Task.FromResult(new EventPage(
                filtered.Skip((page - 1) * pageSize).Take(pageSize).ToList(),
                filtered.Count));
        }

        public Task<EventPage> GetAdminPageAsync(
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new EventPage(events, events.Count));

        public Task<EventPage> GetAdminPageAsync(
            DateTimeOffset? from,
            DateTimeOffset? to,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            var filtered = events.AsEnumerable();
            if (from.HasValue) filtered = filtered.Where(e => e.StartsAt >= from.Value);
            if (to.HasValue) filtered = filtered.Where(e => e.StartsAt < to.Value);
            var list = filtered.OrderBy(e => e.StartsAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToList();
            var totalCount = filtered.Count();
            return Task.FromResult(new EventPage(list, totalCount));
        }

        public Task<Event?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(events.FirstOrDefault(entity => entity.Id == id));

        public Task<Event?> GetPublicByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(events.FirstOrDefault(
                entity => entity.Id == id && entity.Status == EventStatus.Published));

        public Task<Event> AddAsync(Event entity, CancellationToken cancellationToken = default) =>
            Task.FromResult(entity);

        public Task<Event> UpdateAsync(Event entity, CancellationToken cancellationToken = default) =>
            Task.FromResult(entity);

        public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(events.Any(entity => entity.Id == id));
    }
}
