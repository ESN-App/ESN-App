using EsnApp.Application.Common;
using EsnApp.Application.News.Common;
using MediatR;

namespace EsnApp.Application.News.ReorderNewsItems;

public record ReorderNewsItemsCommand(IReadOnlyList<Guid> NewsItemIds)
    : IRequest<Result<IReadOnlyList<NewsItemDto>>>;
