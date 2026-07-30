using EsnApp.Application.Common;
using EsnApp.Application.News.Common;
using EsnApp.Domain.News;
using MediatR;

namespace EsnApp.Application.News.GetAdminNewsItems;

public record GetAdminNewsItemsQuery(NewsItemStatus? Status)
    : IRequest<Result<IReadOnlyList<NewsItemDto>>>;
