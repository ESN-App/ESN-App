using EsnApp.Domain.News;

namespace EsnApp.Api.Contracts.News;

public record UpdateNewsItemRequest(
    string Title,
    string Description,
    string ImagePath);

public record UpdateNewsItemStatusRequest(NewsItemStatus Status);

public record ReorderNewsItemsRequest(IReadOnlyList<Guid> NewsItemIds);
