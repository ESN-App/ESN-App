using EsnApp.Application.Common;
using EsnApp.Application.News.Abstractions;
using EsnApp.Application.News.Common;
using MediatR;

namespace EsnApp.Application.News.GetAdminNewsItems;

public class GetAdminNewsItemsQueryHandler(INewsItemRepository repository)
    : IRequestHandler<GetAdminNewsItemsQuery, Result<IReadOnlyList<AdminNewsItemDto>>>
{
    public async Task<Result<IReadOnlyList<AdminNewsItemDto>>> Handle(
        GetAdminNewsItemsQuery request,
        CancellationToken cancellationToken)
    {
        var items = await repository.GetAdminListAsync(request.Status, cancellationToken);

        return Result.Success<IReadOnlyList<AdminNewsItemDto>>(
            items.Select(AdminNewsItemDto.FromEntity).ToList());
    }
}
