using EsnApp.Application.Events;
using EsnApp.Domain.Events;

namespace EsnApp.Application.Tests.Events;

public class GetEventsListQueryHandlerTests
{
    private sealed class FakeEventRepository(IReadOnlyList<Event> events) : IEventRepository
    {
        public Task<IReadOnlyList<Event>> GetAllAsync(CancellationToken cancellationToken = default) =>
            Task.FromResult(events);

        public Task<Event?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(events.FirstOrDefault(e => e.Id == id));

        public Task<Event> AddAsync(Event entity, CancellationToken cancellationToken = default) =>
            Task.FromResult(entity);
    }

    [Fact]
    public async Task Handle_ReturnsSuccessWithAllEvents()
    {
        var events = new List<Event>
        {
            new() { Id = Guid.NewGuid(), Title = "Welcome Week" },
            new() { Id = Guid.NewGuid(), Title = "City Game" },
        };

        var handler = new GetEventsListQueryHandler(new FakeEventRepository(events));

        var result = await handler.Handle(new GetEventsListQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Equal(2, result.Value.Count);
        Assert.Equal("Welcome Week", result.Value[0].Title);
    }

    [Fact]
    public async Task Handle_WithNoEvents_ReturnsEmptyList()
    {
        var handler = new GetEventsListQueryHandler(new FakeEventRepository([]));

        var result = await handler.Handle(new GetEventsListQuery(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Value);
        Assert.Empty(result.Value);
    }
}
