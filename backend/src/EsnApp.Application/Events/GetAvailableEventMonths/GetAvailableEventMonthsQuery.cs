using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Events.GetAvailableEventMonths;

public record GetAvailableEventMonthsQuery : IRequest<Result<IReadOnlyList<string>>>;
