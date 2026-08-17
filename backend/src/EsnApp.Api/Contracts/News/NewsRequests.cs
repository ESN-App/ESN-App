using EsnApp.Domain.News;

namespace EsnApp.Api.Contracts.News;

public class CreateNewsItemRequest
{
    public required string Title { get; init; }
    public required string Description { get; init; }
    public required IFormFile Image { get; init; }
}

public class UpdateNewsItemRequest
{
    public required string Title { get; init; }
    public required string Description { get; init; }
    public IFormFile? Image { get; init; }
}

public record UpdateNewsItemStatusRequest(NewsItemStatus Status);

public record ReorderNewsItemsRequest(IReadOnlyList<Guid> NewsItemIds);
