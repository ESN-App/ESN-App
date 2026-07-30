using EsnApp.Application.Common;
using EsnApp.Application.News.Common;
using MediatR;

namespace EsnApp.Application.News.GetNewsItemById;

public record GetNewsItemByIdQuery(Guid Id) : IRequest<Result<NewsItemDto>>;
