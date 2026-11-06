using EsnApp.Application.Common;
using EsnApp.Application.Identity;
using EsnApp.Application.News.Abstractions;
using EsnApp.Application.News.Common;
using EsnApp.Domain.News;
using MediatR;

namespace EsnApp.Application.News.CreateNewsItem;

public class CreateNewsItemCommandHandler(INewsItemRepository repository, ICurrentUser currentUser)
    : IRequestHandler<CreateNewsItemCommand, Result<AdminNewsItemDto>>
{
    public async Task<Result<AdminNewsItemDto>> Handle(
        CreateNewsItemCommand request,
        CancellationToken cancellationToken)
    {
        var drafts = await repository.GetAdminListAsync(NewsItemStatus.Draft, cancellationToken);
        var item = new NewsItem
        {
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            ImagePath = request.ImagePath?.Trim(),
            CreatedById = currentUser.UserId,
            CreatedByName = currentUser.DisplayName,
            // New items start as drafts and go on top of the draft list.
            DisplayOrder = drafts.Count == 0 ? 0 : drafts.Min(draft => draft.DisplayOrder) - 1,
        };

        return Result.Success(AdminNewsItemDto.FromEntity(
            await repository.AddAsync(item, cancellationToken)));
    }
}
