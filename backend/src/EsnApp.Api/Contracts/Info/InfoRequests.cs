using EsnApp.Domain.Info;

namespace EsnApp.Api.Contracts.Info;

public record UpdateInfoArticleStatusRequest(InfoArticleStatus Status);

public record ReorderInfoArticlesRequest(IReadOnlyList<Guid> ArticleIds);

public class CreateInfoArticleRequest
{
    public required string Title { get; init; }
    public required string Slug { get; init; }
    public required string Content { get; init; }
    public required string Category { get; init; }
    public required IFormFile Image { get; init; }
    // List<string>, not IReadOnlyList<string>: the form collection binder cannot
    // construct read-only interfaces, so links would silently bind as empty.
    public List<string> ExternalLinks { get; init; } = [];
}

public class UpdateInfoArticleRequest
{
    public required string Title { get; init; }
    public required string Slug { get; init; }
    public required string Content { get; init; }
    public required string Category { get; init; }
    public IFormFile? Image { get; init; }
    // List<string>, not IReadOnlyList<string>: the form collection binder cannot
    // construct read-only interfaces, so links would silently bind as empty.
    public List<string> ExternalLinks { get; init; } = [];
}
