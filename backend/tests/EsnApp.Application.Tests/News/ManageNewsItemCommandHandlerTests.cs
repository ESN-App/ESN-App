using EsnApp.Application.News.Abstractions;
using EsnApp.Application.News.CreateNewsItem;
using EsnApp.Application.News.DeleteNewsItem;
using EsnApp.Application.News.ReorderNewsItems;
using EsnApp.Application.News.UpdateNewsItem;
using EsnApp.Application.News.UpdateNewsItemStatus;
using EsnApp.Domain.News;

namespace EsnApp.Application.Tests.News;

public class ManageNewsItemCommandHandlerTests
{
    [Fact]
    public async Task UpdateStatus_PublishingDraft_AppendsItToPublishedOrder()
    {
        var published = CreateNewsItem(NewsItemStatus.Published, 0);
        var draft = CreateNewsItem(NewsItemStatus.Draft, 0);
        var handler = new UpdateNewsItemStatusCommandHandler(
            new FakeNewsItemRepository(published, draft));

        var result = await handler.Handle(
            new UpdateNewsItemStatusCommand(draft.Id, NewsItemStatus.Published),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(NewsItemStatus.Published, draft.Status);
        Assert.Equal(1, draft.DisplayOrder);
    }

    [Fact]
    public async Task UpdateStatus_MissingNewsItem_ReturnsFailure()
    {
        var handler = new UpdateNewsItemStatusCommandHandler(new FakeNewsItemRepository());

        var result = await handler.Handle(
            new UpdateNewsItemStatusCommand(Guid.NewGuid(), NewsItemStatus.Published),
            CancellationToken.None);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public async Task Reorder_AllPublishedNewsItems_UpdatesEveryDisplayOrder()
    {
        var first = CreateNewsItem(NewsItemStatus.Published, 0);
        var second = CreateNewsItem(NewsItemStatus.Published, 1);
        var handler = new ReorderNewsItemsCommandHandler(
            new FakeNewsItemRepository(first, second));

        var result = await handler.Handle(
            new ReorderNewsItemsCommand([second.Id, first.Id]),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(0, second.DisplayOrder);
        Assert.Equal(1, first.DisplayOrder);
        Assert.Equal([second.Id, first.Id], result.Value!.Select(item => item.Id));
    }

    [Fact]
    public async Task Reorder_MissingPublishedNewsItem_ReturnsFailure()
    {
        var first = CreateNewsItem(NewsItemStatus.Published, 0);
        var second = CreateNewsItem(NewsItemStatus.Published, 1);
        var handler = new ReorderNewsItemsCommandHandler(
            new FakeNewsItemRepository(first, second));

        var result = await handler.Handle(
            new ReorderNewsItemsCommand([first.Id]),
            CancellationToken.None);

        Assert.False(result.IsSuccess);
        Assert.Equal(0, first.DisplayOrder);
        Assert.Equal(1, second.DisplayOrder);
    }

    [Fact]
    public async Task Reorder_DraftNewsItem_ReturnsFailure()
    {
        var published = CreateNewsItem(NewsItemStatus.Published, 0);
        var draft = CreateNewsItem(NewsItemStatus.Draft, 0);
        var handler = new ReorderNewsItemsCommandHandler(
            new FakeNewsItemRepository(published, draft));

        var result = await handler.Handle(
            new ReorderNewsItemsCommand([draft.Id, published.Id]),
            CancellationToken.None);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public async Task Create_NewsItem_TrimsTextAndStartsAsDraft()
    {
        var handler = new CreateNewsItemCommandHandler(new FakeNewsItemRepository());

        var result = await handler.Handle(
            new CreateNewsItemCommand(
                "  Orientation Week is almost here  ",
                "  Everything you need to know.  ",
                "  /api/images/uploads/news/image.jpg  "),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Orientation Week is almost here", result.Value!.Title);
        Assert.Equal("Everything you need to know.", result.Value.Description);
        Assert.Equal("/api/images/uploads/news/image.jpg", result.Value.ImagePath);
        Assert.Equal(NewsItemStatus.Draft, result.Value.Status);
    }

    [Fact]
    public async Task Update_MissingNewsItem_ReturnsFailure()
    {
        var handler = new UpdateNewsItemCommandHandler(new FakeNewsItemRepository());

        var result = await handler.Handle(
            new UpdateNewsItemCommand(
                Guid.NewGuid(),
                "Title",
                "Description",
                "/api/images/uploads/news/image.jpg"),
            CancellationToken.None);

        Assert.False(result.IsSuccess);
    }

    [Fact]
    public async Task Delete_ExistingNewsItem_DeletesNewsItem()
    {
        var item = CreateNewsItem(NewsItemStatus.Published, 0);
        var repository = new FakeNewsItemRepository(item);
        var handler = new DeleteNewsItemCommandHandler(repository);

        var result = await handler.Handle(
            new DeleteNewsItemCommand(item.Id),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Empty(await repository.GetAdminListAsync(null, CancellationToken.None));
    }

    [Fact]
    public async Task Delete_MissingNewsItem_ReturnsFailure()
    {
        var handler = new DeleteNewsItemCommandHandler(new FakeNewsItemRepository());

        var result = await handler.Handle(
            new DeleteNewsItemCommand(Guid.NewGuid()),
            CancellationToken.None);

        Assert.False(result.IsSuccess);
    }

    private static NewsItem CreateNewsItem(NewsItemStatus status, int displayOrder) => new()
    {
        Id = Guid.NewGuid(),
        Title = "News item",
        Description = "Description",
        ImagePath = "/api/images/uploads/news/image.jpg",
        Status = status,
        DisplayOrder = displayOrder,
    };

    private sealed class FakeNewsItemRepository(params NewsItem[] items) : INewsItemRepository
    {
        private readonly List<NewsItem> _items = [.. items];

        public Task<IReadOnlyList<NewsItem>> GetPublishedAsync(
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<NewsItem>>(_items
                .Where(item => item.Status == NewsItemStatus.Published)
                .OrderBy(item => item.DisplayOrder).ToList());

        public Task<NewsItem?> GetPublishedByIdAsync(
            Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(_items.FirstOrDefault(item =>
                item.Id == id && item.Status == NewsItemStatus.Published));

        public Task<IReadOnlyList<NewsItem>> GetAdminListAsync(
            NewsItemStatus? status, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<NewsItem>>(_items
                .Where(item => !status.HasValue || item.Status == status)
                .OrderBy(item => item.Status)
                .ThenBy(item => item.DisplayOrder).ToList());

        public Task<NewsItem?> GetAdminByIdAsync(
            Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(_items.FirstOrDefault(item => item.Id == id));

        public Task<NewsItem> AddAsync(
            NewsItem entity, CancellationToken cancellationToken = default)
        {
            _items.Add(entity);
            return Task.FromResult(entity);
        }

        public Task<NewsItem> UpdateAsync(
            NewsItem entity, CancellationToken cancellationToken = default) =>
            Task.FromResult(entity);

        public Task UpdateRangeAsync(
            IReadOnlyCollection<NewsItem> entities,
            CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task<bool> DeleteAsync(
            Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(_items.RemoveAll(item => item.Id == id) > 0);
    }
}
