using EsnApp.Application.Common;
using EsnApp.Application.News.Abstractions;
using EsnApp.Application.News.Common;
using MediatR;

namespace EsnApp.Application.News.GetAdminNewsItemById;

public class GetAdminNewsItemByIdQueryHandler(INewsItemRepository repository)
    : IRequestHandler<GetAdminNewsItemByIdQuery, Result<NewsItemDto>>
{
    public async Task<Result<NewsItemDto>> Handle(
        GetAdminNewsItemByIdQuery request,
        CancellationToken cancellationToken)
    {
        var item = await repository.GetAdminByIdAsync(request.Id, cancellationToken);

        return item is null
            ? Result.Failure<NewsItemDto>($"News item '{request.Id}' was not found.")
            : Result.Success(NewsItemDto.FromEntity(item));
    }
}
