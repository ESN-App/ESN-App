using EsnApp.Application.Events.Abstractions;
using EsnApp.Application.Events.DeleteEvent;
using EsnApp.Application.Events.UpdateEventStatus;
using EsnApp.Domain.Events;

namespace EsnApp.Application.Tests.Events;

public class ManageEventCommandHandlerTests
{
    [Fact]
    public async Task UpdateStatus_ExistingEvent_ChangesStatus()
    {
        var entity = CreateEvent();
        var repository = new FakeEventRepository(entity);
        var handler = new UpdateEventStatusCommandHandler(repository);

        var result = await handler.Handle(
            new UpdateEventStatusCommand(entity.Id, EventStatus.Published),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(EventStatus.Published, result.Value!.Status);
        Assert.NotNull(entity.PublishedAt);
        Assert.Equal("Event", result.Value.Title);
        Assert.Equal("Summary", result.Value.ShortDescription);
        Assert.Equal(entity.Location, result.Value.Location);
    }

    [Fact]
    public async Task UpdateStatus_MissingEvent_ReturnsFailure()
    {
        var handler = new UpdateEventStatusCommandHandler(new FakeEventRepository());

        var result = await handler.Handle(
            new UpdateEventStatusCommand(Guid.NewGuid(), EventStatus.Cancelled),
            CancellationToken.None);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public async Task Delete_ExistingEvent_DeletesEvent()
    {
        var entity = CreateEvent();
        var repository = new FakeEventRepository(entity);
        var handler = new DeleteEventCommandHandler(repository);

        var result = await handler.Handle(new DeleteEventCommand(entity.Id), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Null(await repository.GetByIdAsync(entity.Id));
    }

    [Fact]
    public async Task Delete_MissingEvent_ReturnsFailure()
    {
        var handler = new DeleteEventCommandHandler(new FakeEventRepository());

        var result = await handler.Handle(new DeleteEventCommand(Guid.NewGuid()), CancellationToken.None);

        Assert.False(result.IsSuccess);
    }

    private static Event CreateEvent() => new()
    {
        Id = Guid.NewGuid(),
        Title = "Event",
        ShortDescription = "Summary",
        Description = "Full description",
        Location = "Gdańsk",
        StartsAt = DateTimeOffset.UtcNow.AddDays(1),
        EndsAt = DateTimeOffset.UtcNow.AddDays(1).AddHours(2),
    };

    private sealed class FakeEventRepository(params Event[] events) : IEventRepository
    {
        private readonly List<Event> _events = [.. events];

        public Task<IReadOnlyList<Event>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Event>>(_events);

        public Task<EventPage> GetPublicPageAsync(
            DateTimeOffset from,
            DateTimeOffset to,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new EventPage(_events, _events.Count));

        public Task<EventPage> GetAdminPageAsync(
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(new EventPage(_events, _events.Count));

        public Task<EventPage> GetAdminPageAsync(
            DateTimeOffset? from,
            DateTimeOffset? to,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default)
        {
            var filtered = _events.AsEnumerable();
            if (from.HasValue) filtered = filtered.Where(e => e.StartsAt >= from.Value);
            if (to.HasValue) filtered = filtered.Where(e => e.StartsAt < to.Value);
            var list = filtered.ToList();
            return Task.FromResult(new EventPage(list, list.Count));
        }

        public Task<Event?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(_events.FirstOrDefault(entity => entity.Id == id));

        public Task<Event?> GetPublicByIdAsync(
            Guid id,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(_events.FirstOrDefault(
                entity => entity.Id == id && entity.Status == EventStatus.Published));

        public Task<Event> AddAsync(Event entity, CancellationToken cancellationToken = default)
        {
            _events.Add(entity);
            return Task.FromResult(entity);
        }

        public Task<Event> UpdateAsync(Event entity, CancellationToken cancellationToken = default) =>
            Task.FromResult(entity);

        public Task<bool> DeleteAsync(Guid id, CancellationToken cancellationToken = default)
        {
            var entity = _events.FirstOrDefault(item => item.Id == id);
            return Task.FromResult(entity is not null && _events.Remove(entity));
        }
    }
}
