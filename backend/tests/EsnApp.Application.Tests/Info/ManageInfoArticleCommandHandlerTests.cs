using EsnApp.Application.Info;
using EsnApp.Domain.Info;

namespace EsnApp.Application.Tests.Info;

public class ManageInfoArticleCommandHandlerTests
{
    [Fact]
    public async Task Publish_DraftArticle_AppendsItToPublishedOrder()
    {
        var published = CreateArticle(InfoArticleStatus.Published, 0);
        var draft = CreateArticle(InfoArticleStatus.Draft, 0);
        var handler = new UpdateInfoArticleStatusCommandHandler(
            new FakeInfoArticleRepository(published, draft));

        var result = await handler.Handle(
            new UpdateInfoArticleStatusCommand(draft.Id, InfoArticleStatus.Published),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(InfoArticleStatus.Published, draft.Status);
        Assert.Equal(1, draft.DisplayOrder);
    }

    [Fact]
    public async Task Reorder_AllPublishedArticles_UpdatesEveryDisplayOrder()
    {
        var first = CreateArticle(InfoArticleStatus.Published, 0);
        var second = CreateArticle(InfoArticleStatus.Published, 1);
        var handler = new ReorderInfoArticlesCommandHandler(
            new FakeInfoArticleRepository(first, second));

        var result = await handler.Handle(
            new ReorderInfoArticlesCommand([second.Id, first.Id]),
            CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(0, second.DisplayOrder);
        Assert.Equal(1, first.DisplayOrder);
        Assert.Equal([second.Id, first.Id], result.Value!.Select(article => article.Id));
    }

    [Fact]
    public async Task Create_DuplicateSlug_ReturnsFailure()
    {
        var existing = CreateArticle(InfoArticleStatus.Draft, 0);
        var handler = new CreateInfoArticleCommandHandler(
            new FakeInfoArticleRepository(existing));

        var result = await handler.Handle(
            new CreateInfoArticleCommand(
                "Another article",
                existing.Slug,
                "Content",
                "General",
                new Uri("https://example.com/image.jpg"),
                []),
            CancellationToken.None);

        Assert.False(result.IsSuccess);
    }

    private static InfoArticle CreateArticle(InfoArticleStatus status, int displayOrder) => new()
    {
        Id = Guid.NewGuid(),
        Title = "Article",
        Slug = $"article-{Guid.NewGuid():N}",
        Content = "Content",
        Category = "General",
        ImageUrl = new Uri("https://example.com/image.jpg"),
        Status = status,
        DisplayOrder = displayOrder,
    };

    private sealed class FakeInfoArticleRepository(params InfoArticle[] articles)
        : IInfoArticleRepository
    {
        private readonly List<InfoArticle> _articles = [.. articles];

        public Task<IReadOnlyList<InfoArticle>> GetAllAsync(
            string? category, CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<InfoArticle>>(_articles
                .Where(article => article.Status == InfoArticleStatus.Published)
                .Where(article => category is null || article.Category == category)
                .OrderBy(article => article.DisplayOrder).ToList());

        public Task<InfoArticle?> GetByIdAsync(
            Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(_articles.FirstOrDefault(article =>
                article.Id == id && article.Status == InfoArticleStatus.Published));

        public Task<InfoArticle?> GetBySlugAsync(
            string slug, CancellationToken cancellationToken = default) =>
            Task.FromResult(_articles.FirstOrDefault(article =>
                article.Slug == slug && article.Status == InfoArticleStatus.Published));

        public Task<IReadOnlyList<InfoArticle>> GetAdminListAsync(
            InfoArticleStatus? status, string? category,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<InfoArticle>>(_articles
                .Where(article => !status.HasValue || article.Status == status)
                .Where(article => category is null || article.Category == category)
                .OrderBy(article => article.DisplayOrder).ToList());

        public Task<InfoArticle?> GetAdminByIdAsync(
            Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(_articles.FirstOrDefault(article => article.Id == id));

        public Task<bool> SlugExistsAsync(
            string slug, Guid? excludingId = null,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(_articles.Any(article =>
                article.Slug == slug && article.Id != excludingId));

        public Task<InfoArticle> AddAsync(
            InfoArticle entity, CancellationToken cancellationToken = default)
        {
            _articles.Add(entity);
            return Task.FromResult(entity);
        }

        public Task<InfoArticle> UpdateAsync(
            InfoArticle entity, CancellationToken cancellationToken = default) =>
            Task.FromResult(entity);

        public Task UpdateRangeAsync(
            IReadOnlyCollection<InfoArticle> entities,
            CancellationToken cancellationToken = default) => Task.CompletedTask;

        public Task<bool> DeleteAsync(
            Guid id, CancellationToken cancellationToken = default) =>
            Task.FromResult(_articles.RemoveAll(article => article.Id == id) > 0);
    }
}
