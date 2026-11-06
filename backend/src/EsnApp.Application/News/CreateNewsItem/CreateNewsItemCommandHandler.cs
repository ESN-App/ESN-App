using EsnApp.Application.Common;
using EsnApp.Application.News.Abstractions;
using EsnApp.Application.News.Common;
using EsnApp.Domain.News;
using MediatR;

namespace EsnApp.Application.News.CreateNewsItem;

public class CreateNewsItemCommandHandler(INewsItemRepository repository)
    : IRequestHandler<CreateNewsItemCommand, Result<NewsItemDto>>
{
    public async Task<Result<NewsItemDto>> Handle(
        CreateNewsItemCommand request,
        CancellationToken cancellationToken)
    {
        var drafts = await repository.GetAdminListAsync(NewsItemStatus.Draft, cancellationToken);
        var item = new NewsItem
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            ImagePath = request.ImagePath.Trim(),
            // New items start as drafts and go on top of the draft list.
            DisplayOrder = drafts.Count == 0 ? 0 : drafts.Min(draft => draft.DisplayOrder) - 1,
        };

        return Result.Success(NewsItemDto.FromEntity(
            await repository.AddAsync(item, cancellationToken)));
    }
}
