using EsnApp.Application.Common;
using EsnApp.Application.News.Common;
using MediatR;

namespace EsnApp.Application.News.GetAdminNewsItemById;

public record GetAdminNewsItemByIdQuery(Guid Id) : IRequest<Result<NewsItemDto>>;
