using EsnApp.Application.Common;
using EsnApp.Application.News.Abstractions;
using EsnApp.Application.News.Common;
using MediatR;

namespace EsnApp.Application.News.GetNewsItemById;

public class GetNewsItemByIdQueryHandler(INewsItemRepository repository)
    : IRequestHandler<GetNewsItemByIdQuery, Result<NewsItemDto>>
{
    public async Task<Result<NewsItemDto>> Handle(
        GetNewsItemByIdQuery request,
        CancellationToken cancellationToken)
    {
        var item = await repository.GetPublishedByIdAsync(request.Id, cancellationToken);

        return item is null
            ? Result.Failure<NewsItemDto>($"News item '{request.Id}' was not found.")
            : Result.Success(NewsItemDto.FromEntity(item));
    }
}
