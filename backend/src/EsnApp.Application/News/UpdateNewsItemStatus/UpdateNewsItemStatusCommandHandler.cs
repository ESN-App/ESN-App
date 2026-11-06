using EsnApp.Application.Common;
using EsnApp.Application.News.Abstractions;
using EsnApp.Application.News.Common;
using EsnApp.Domain.News;
using MediatR;

namespace EsnApp.Application.News.UpdateNewsItemStatus;

public class UpdateNewsItemStatusCommandHandler(INewsItemRepository repository)
    : IRequestHandler<UpdateNewsItemStatusCommand, Result<AdminNewsItemDto>>
{
    public async Task<Result<AdminNewsItemDto>> Handle(
        UpdateNewsItemStatusCommand request,
        CancellationToken cancellationToken)
    {
        var item = await repository.GetAdminByIdAsync(request.Id, cancellationToken);

        if (item is null)
            return Result.Failure<AdminNewsItemDto>($"News item '{request.Id}' was not found.");

        if (item.Status != NewsItemStatus.Published
            && request.Status == NewsItemStatus.Published)
        {
            var published = await repository.GetAdminListAsync(
                NewsItemStatus.Published,
                cancellationToken);
            // Newly published items go on top; admins can reorder afterwards.
            item.DisplayOrder = published.Count == 0
                ? 0
                : published.Min(newsItem => newsItem.DisplayOrder) - 1;
        }

        item.Status = request.Status;

        return Result.Success(AdminNewsItemDto.FromEntity(
            await repository.UpdateAsync(item, cancellationToken)));
    }
}
