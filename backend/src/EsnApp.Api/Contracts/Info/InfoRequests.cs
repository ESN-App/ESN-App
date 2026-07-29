using EsnApp.Domain.Info;

namespace EsnApp.Api.Contracts.Info;

public record UpdateInfoArticleStatusRequest(InfoArticleStatus Status);

public record ReorderInfoArticlesRequest(IReadOnlyList<Guid> ArticleIds);

public record UpdateInfoArticleRequest(
    string Title,
    string Slug,
    string Content,
    string Category,
    Uri ImageUrl,
    IReadOnlyList<string> ExternalLinks);
