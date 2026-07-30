using EsnApp.Application.Common;
using EsnApp.Application.News.Abstractions;
using EsnApp.Application.News.Common;
using EsnApp.Domain.News;
using MediatR;

namespace EsnApp.Application.News.ReorderNewsItems;

public class ReorderNewsItemsCommandHandler(INewsItemRepository repository)
    : IRequestHandler<ReorderNewsItemsCommand, Result<IReadOnlyList<NewsItemDto>>>
{
    public async Task<Result<IReadOnlyList<NewsItemDto>>> Handle(
        ReorderNewsItemsCommand request,
        CancellationToken cancellationToken)
    {
        var published = await repository.GetAdminListAsync(
            NewsItemStatus.Published,
            cancellationToken);
        var requestedIds = request.NewsItemIds.ToHashSet();
        var publishedIds = published.Select(item => item.Id).ToHashSet();

        if (requestedIds.Count != publishedIds.Count || !requestedIds.SetEquals(publishedIds))
        {
            return Result.Failure<IReadOnlyList<NewsItemDto>>(
                "NewsItemIds must contain every published news item exactly once.");
        }

        var byId = published.ToDictionary(item => item.Id);

        for (var index = 0; index < request.NewsItemIds.Count; index++)
            byId[request.NewsItemIds[index]].DisplayOrder = index;

        await repository.UpdateRangeAsync(published, cancellationToken);

        return Result.Success<IReadOnlyList<NewsItemDto>>(
            request.NewsItemIds.Select(id => NewsItemDto.FromEntity(byId[id])).ToList());
    }
}
