using EsnApp.Application.Common;
using EsnApp.Application.News.Abstractions;
using EsnApp.Application.News.Common;
using EsnApp.Domain.News;
using MediatR;

namespace EsnApp.Application.News.UpdateNewsItemStatus;

public class UpdateNewsItemStatusCommandHandler(INewsItemRepository repository)
    : IRequestHandler<UpdateNewsItemStatusCommand, Result<NewsItemDto>>
{
    public async Task<Result<NewsItemDto>> Handle(
        UpdateNewsItemStatusCommand request,
        CancellationToken cancellationToken)
    {
        var item = await repository.GetAdminByIdAsync(request.Id, cancellationToken);

        if (item is null)
            return Result.Failure<NewsItemDto>($"News item '{request.Id}' was not found.");

        if (item.Status != NewsItemStatus.Published
            && request.Status == NewsItemStatus.Published)
        {
            var published = await repository.GetAdminListAsync(
                NewsItemStatus.Published,
                cancellationToken);
            item.DisplayOrder = published.Count == 0
                ? 0
                : published.Max(newsItem => newsItem.DisplayOrder) + 1;
        }

        item.Status = request.Status;

        return Result.Success(NewsItemDto.FromEntity(
            await repository.UpdateAsync(item, cancellationToken)));
    }
}
