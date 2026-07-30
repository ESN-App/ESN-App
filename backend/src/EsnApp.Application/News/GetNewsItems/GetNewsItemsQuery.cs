using EsnApp.Application.Common;
using EsnApp.Application.News.Common;
using MediatR;

namespace EsnApp.Application.News.GetNewsItems;

public record GetNewsItemsQuery : IRequest<Result<IReadOnlyList<NewsItemDto>>>;
