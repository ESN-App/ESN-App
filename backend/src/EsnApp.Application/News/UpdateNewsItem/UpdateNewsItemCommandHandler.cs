using EsnApp.Application.Common;
using EsnApp.Application.News.Abstractions;
using EsnApp.Application.News.Common;
using MediatR;

namespace EsnApp.Application.News.UpdateNewsItem;

public class UpdateNewsItemCommandHandler(INewsItemRepository repository)
    : IRequestHandler<UpdateNewsItemCommand, Result<NewsItemDto>>
{
    public async Task<Result<NewsItemDto>> Handle(
        UpdateNewsItemCommand request,
        CancellationToken cancellationToken)
    {
        var item = await repository.GetAdminByIdAsync(request.Id, cancellationToken);

        if (item is null)
            return Result.Failure<NewsItemDto>($"News item '{request.Id}' was not found.");

        item.Title = request.Title.Trim();
        item.Description = request.Description.Trim();
        item.ImagePath = request.ImagePath.Trim();

        return Result.Success(NewsItemDto.FromEntity(
            await repository.UpdateAsync(item, cancellationToken)));
    }
}
