using EsnApp.Application.Common;
using EsnApp.Application.News.Abstractions;
using EsnApp.Application.News.Common;
using MediatR;

namespace EsnApp.Application.News.GetNewsItems;

public class GetNewsItemsQueryHandler(INewsItemRepository repository)
    : IRequestHandler<GetNewsItemsQuery, Result<IReadOnlyList<NewsItemDto>>>
{
    public async Task<Result<IReadOnlyList<NewsItemDto>>> Handle(
        GetNewsItemsQuery request,
        CancellationToken cancellationToken)
    {
        var items = await repository.GetPublishedAsync(cancellationToken);

        return Result.Success<IReadOnlyList<NewsItemDto>>(
            items.Select(NewsItemDto.FromEntity).ToList());
    }
}
