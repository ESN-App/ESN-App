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
        var item = new NewsItem
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            ImagePath = request.ImagePath.Trim(),
        };

        return Result.Success(NewsItemDto.FromEntity(
            await repository.AddAsync(item, cancellationToken)));
    }
}
